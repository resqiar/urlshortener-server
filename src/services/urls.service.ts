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

    // Calculate Expiration Day
    const expireAt: string = this.calculateExpire(body.expireDay);

    /**
     * Define the SQL to create a new URL to the table with the value
     * specified alongside the parameters.
     *
     * This SQL will insert a new row in the table and return id, original_url,
     * and also the short_url.
     **/
    const CREATE_SQL = `
        INSERT INTO urls (original_url, short_url, description, author_id, expire_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, original_url, short_url;
    `;

    try {
      // Execute the SQL with specified parameter
      const query = await this.server.pg.query(CREATE_SQL, [
        body.originalUrl,
        body.shortUrl,
        body.description,
        userId,
        expireAt,
      ]);

      return query.rows[0];
    } catch (error) {
      console.log(error);
    }
  }

  async findByShort(short: string): Promise<any> {
    /**
     * Define SQL that selects rows from the 'urls' table
     * where the 'short_url' is equal to 'short' and the 'expire_at'
     * column is greater than the current time.
     *
     * The 'expire_at' is compared to the current time using the now() from Postgres.
     **/
    const FIND_SQL = `
        SELECT * FROM urls 
        WHERE short_url = $1
        AND expire_at > now();
    `;

    try {
      // Execute the query
      const query = await this.server.pg.query(FIND_SQL, [short]);

      if (query.rows.length === 0) return;

      return query.rows;
    } catch (error) {
      console.log(error);
    }
  }

  async findByUser(userId: string): Promise<any> {
    /**
     * The SQL contains a 'SELECT' statement with a 'JOIN' clause
     * that specifies how the 'urls' and 'users' tables should be joined.
     * The 'ON' clause specifies the join condition,
     * which is that the 'author_id' column in the 'urls' table is equal to the 'id'
     * column in the 'users' table.
     *
     * The 'expire_at' column should be greater than the current time.
     * The 'ORDER BY' clause specifies that the rows should be ordered
     * by the 'created_at' column in ascending order.
     **/
    const FIND_SQL = `
        SELECT urls.*, users.username, users.avatar_url
        FROM urls JOIN users
        ON urls.author_id = users.id
        WHERE urls.author_id = $1
        AND urls.expire_at > now()
        ORDER BY urls.created_at ASC;
    `;

    try {
      // Execute the SQL and while passing the respected $ parameter
      const query = await this.server.pg.query(FIND_SQL, [userId]);

      if (query.rows.length === 0) return;

      return query.rows;
    } catch (error) {
      console.log(error);
    }
  }

  async visit(urlId: string): Promise<void> {
    /**
     * Find a url from 'urls' table where the ID is
     * equal to the specified urlId.
     **/
    const FIND_SQL = `
        SELECT id FROM urls WHERE id = $1;
    `;

    /**
     * This block defines a SQL query that increments
     * the value of the 'visits' column for a row
     * in the 'urls' table where the 'id' is equal to specified.
     **/
    const INCREMENT_SQL = `
        UPDATE urls SET visits = visits + 1 WHERE id = $1;
    `;

    try {
      // Execute the SQL to find the URL
      const findQuery = await this.server.pg.query(FIND_SQL, [urlId]);

      // If not found, dont proceed and do immediate return
      if (findQuery.rows.length === 0) return;

      // Then do the update SQL
      await this.server.pg.query(INCREMENT_SQL, [urlId]);
    } catch (error) {
      console.log(error);
    }
  }

  async delete(body: any, userId: string): Promise<any> {
    /**
     * Define the SQL to find specified url inside the table,
     * the URL id must equal to the specified id and also the author_id-
     * must be also equal to the specified userId.
     **/
    const FIND_SQL = `
        SELECT id FROM urls 
        WHERE id = $1 AND author_id = $2;
    `;
    /**
     * Define the SQL to delete specified url inside the table,
     * the URL id must equal to the specified id.
     * Also return the ID of the deleted URL.
     **/
    const DELETE_SQL = `
        DELETE FROM urls
        WHERE id = $1
        RETURNING id;
    `;

    try {
      // Execute SQL to find the URL
      const findQuery = await this.server.pg.query(FIND_SQL, [body.id, userId]);

      // If nothing found, then return nothing.
      if (findQuery.rows.length === 0) return;

      // Then execute the deletion query
      const deleteQuery = await this.server.pg.query(DELETE_SQL, [body.id]);

      // If nothing return than that means the DELETE failed
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
