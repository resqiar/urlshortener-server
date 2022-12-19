import { FastifyInstance } from "fastify";

export default class URLService {
  constructor(private server: FastifyInstance) {}

  async create(body: any, userId: string): Promise<{} | void> {
    /**
     * Check if the short URL is already exist inside the database.
     * If a duplicate is found, return an error message indicating
     * that the the short URL name needs to be unique.
     **/
    const isDuplicate = await this.findByShort(body.shortUrl);
    if (isDuplicate)
      return {
        error: "duplicate",
        message: "Custom name already exist, make a unique one!",
      };

    // Calculate Expiration Day to Date
    const expireAt: string = this.calculateExpire(body.expireDay);

    const CREATE_SQL = `
        INSERT INTO urls (original_url, short_url, description, author_id, expire_at)
        VALUES (
          '${body.originalUrl}',
          '${body.shortUrl}',
          '${body.description}',
          '${userId}',
          '${expireAt}'
        )
        RETURNING id, original_url, short_url;
    `;

    try {
      const query = await this.server.pg.query(CREATE_SQL);
      return query.rows[0];
    } catch (error) {
      console.log(error);
    }
  }

  async findByShort(short: string): Promise<any> {
    const FIND_SQL = `
        SELECT * FROM urls 
        WHERE short_url = '${short}'
        AND expire_at > now();
    `;

    try {
      const query = await this.server.pg.query(FIND_SQL);

      if (query.rows.length === 0) return;

      return query.rows;
    } catch (error) {
      console.log(error);
    }
  }

  async findByUser(userId: string): Promise<any> {
    const FIND_SQL = `
        SELECT urls.*, users.username, users.avatar_url
        FROM urls JOIN users
        ON urls.author_id = users.id
        WHERE urls.author_id = '${userId}'
        AND urls.expire_at > now()
        ORDER BY urls.created_at ASC;
    `;

    try {
      const query = await this.server.pg.query(FIND_SQL);

      if (query.rows.length === 0) return;

      return query.rows;
    } catch (error) {
      console.log(error);
    }
  }

  async visit(urlId: string): Promise<any> {
    const FIND_SQL = `
        SELECT id FROM urls WHERE id = '${urlId}';
    `;
    const INCREMENT_SQL = `
        UPDATE urls SET visits = visits + 1 WHERE id = '${urlId}';
    `;

    try {
      const findQuery = await this.server.pg.query(FIND_SQL);

      if (findQuery.rows.length === 0) return;

      await this.server.pg.query(INCREMENT_SQL);
    } catch (error) {
      console.log(error);
    }
  }

  async delete(body: any, userId: string): Promise<any> {
    const FIND_SQL = `
        SELECT id FROM urls 
        WHERE id = '${body.id}' AND author_id = '${userId}';
    `;

    const DELETE_SQL = `
        DELETE FROM urls
        WHERE id = '${body.id}'
        RETURNING id;
    `;

    try {
      const findQuery = await this.server.pg.query(FIND_SQL);

      if (findQuery.rows.length === 0) return;

      const deleteQuery = await this.server.pg.query(DELETE_SQL);

      if (deleteQuery.rows.length === 0) return;

      return { status: 200 };
    } catch (error) {
      console.log(error);
    }
  }

  private calculateExpire(days: number): string {
    const oneDayFromNow = new Date();

    oneDayFromNow.setDate(oneDayFromNow.getDate() + days);

    // Get the time zone offset in minutes
    const timeZoneOffsetInMinutes = oneDayFromNow.getTimezoneOffset();

    // Convert the time zone offset to hours and minutes
    const timeZoneOffset = `${Math.floor(timeZoneOffsetInMinutes / 60)}:${
      timeZoneOffsetInMinutes % 60
    }`;

    // Append the time zone offset to the ISO string
    return `${oneDayFromNow.toISOString()}${timeZoneOffset}`;
  }
}
