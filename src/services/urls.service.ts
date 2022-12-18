import { FastifyInstance } from "fastify";

export default class URLService {
  constructor(private server: FastifyInstance) {}

  async create(body: any, userId: string): Promise<{} | void> {
    const isDuplicate = await this.findByShort(body.shortUrl);
    if (isDuplicate.length)
      return {
        error: "Short URL already exist, make a unique one!",
      };

    const expireAt = this.calculateExpire(body.expireDay);

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
      console.log(query.rows);
    } catch (error) {
      console.log(error);
    }
  }

  async findByShort(short: string): Promise<any> {
    const FIND_SQL = `
        SELECT * FROM urls WHERE short_url = '${short}';
    `;

    try {
      const query = await this.server.pg.query(FIND_SQL);

      if (query.rows.length === 0) return;

      return query.rows;
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
