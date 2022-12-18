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

      // Compare password and hashed password
      const isMatch = await this.server.bcrypt.compare(
        body.password,
        query.rows[0].password
      );

      if (!isMatch) return;

      // generate a JWT token
      const token = this.server.jwt.sign({
        id: query.rows[0].id,
      });

      return token;
    } catch (error) {
      console.log(error);
    }
  }

  async register(body: any): Promise<string | void> {
    if (!body.username || !body.email || !body.password) return;

    // Hashed password
    const hashedPassword = await this.server.bcrypt.hash(body.password);

    const CREATE_SQL = `
        INSERT INTO users (username, email, password)
        VALUES ('${body.username}', '${body.email}', '${hashedPassword}')
        RETURNING id;
    `;

    try {
      const query = await this.server.pg.query(CREATE_SQL);

      // generate a JWT token
      const token = this.server.jwt.sign({
        id: query.rows[0].id,
      });

      return token;
    } catch (error) {
      console.log(error);
    }
  }
}
