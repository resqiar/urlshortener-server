import { FastifyInstance } from "fastify";

export default class AuthService {
  constructor(private server: FastifyInstance) {}

  async login(body: any): Promise<string | void> {
    if (!body.username || !body.password) return;

    const FIND_SQL = `
        SELECT * FROM users WHERE username = '${body.username}' LIMIT 1;
    `;

    try {
      const query = await this.server.pg.query(FIND_SQL);

      if (query.rows.length === 0) return;

      /**
       * Compare a plaintext password (body.password) with
       * a hashed password inside the database (query.rows[0].password).
       * If matched it will return true, otherwise false.
       **/
      const isMatch = await this.server.bcrypt.compare(
        body.password,
        query.rows[0].password
      );

      if (!isMatch) return;

      // generate a JWT token
      const token = this.generateToken({
        id: query.rows[0].id,
      });

      return token;
    } catch (error) {
      console.log(error);
    }
  }

  async register(body: any): Promise<string | void> {
    if (!body.username || !body.email || !body.password) return;

    /**
     * Hash the plain password provided by user using "bcrypt" package.
     * This step is really important to ensure the password is safe before
     * saving into the database.
     **/
    const hashedPassword = await this.server.bcrypt.hash(body.password);

    const CREATE_SQL = `
        INSERT INTO users (username, email, password)
        VALUES ('${body.username}', '${body.email}', '${hashedPassword}')
        RETURNING id;
    `;

    try {
      const query = await this.server.pg.query(CREATE_SQL);

      // generate a JWT token
      const token = this.generateToken({
        id: query.rows[0].id,
      });

      return token;
    } catch (error) {
      console.log(error);
    }
  }

  private generateToken(payload: any) {
    /**
     * Create a JSON Web Token and sign alongside the id
     * of the user. The sign method returns a signed JWT
     * in the form of a string.
     **/
    return this.server.jwt.sign(payload);
  }
}
