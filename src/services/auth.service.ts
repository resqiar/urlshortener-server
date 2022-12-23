import { FastifyInstance } from "fastify";

export default class AuthService {
  constructor(private server: FastifyInstance) {}

  async login(body: any): Promise<string | void> {
    if (!body.username || !body.password) return;
    /**
     * Find all the data from users that match the provided username.
     * This SQL is more protected to SQL injection since we use
     * prepared statement / placeholder "$".
     *
     * Even so, its worth noting that if the body.username is not sanitize,
     * its still vulnerable to SQL injection.
     **/
    const FIND_SQL = `
        SELECT * FROM users WHERE username = $1 LIMIT 1;
    `;

    try {
      // Execute the query while passing the prepared statement value
      const query = await this.server.pg.query(FIND_SQL, body.username);

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

      // Generate a JWT token
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

    /**
     * Inserts a new row into the 'users' table.
     * The row contains values for the 'username', 'email', and 'password' columns.
     *
     * The 'RETURNING id' clause specifies that the 'id' column,
     * This will return the ID of the newly inserted row.
     **/
    const CREATE_SQL = `
        INSERT INTO users (username, email, password)
        VALUES ($1, $2, $3)
        RETURNING id;
    `;

    try {
      const query = await this.server.pg.query(CREATE_SQL, [
        body.username,
        body.email,
        hashedPassword,
      ]);

      // Generate a JWT token
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
