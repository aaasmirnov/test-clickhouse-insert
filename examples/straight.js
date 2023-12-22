const { createClient } = require('@clickhouse/client');
const { faker } = require('@faker-js/faker');
const { DateTime } = require('luxon');

const exec = async() => {
    const client = createClient({
        host: 'http://127.0.0.1:20123',
        username: 'test',
        password: 'test',
        database: 'test',
        clickhouse_settings: {
            tcp_keep_alive_timeout: 30_000,
        },
    });

    await client.query({
        query: 'CREATE TABLE IF NOT EXISTS demo_straight_table(id UUID, name String, value UInt32, timestamp DateTime) ENGINE MergeTree PARTITION BY toYYYYMM(timestamp) ORDER BY timestamp',
    });
    await client.query({
        query: 'TRUNCATE TABLE demo_straight_table',
    });

    const start = Date.now();
    const count = 10_000;

    for (let index = 0; index < count; index += 1) {
        const row = {
            id: faker.string.uuid(),
            name: faker.person.firstName(),
            value: index,
            timestamp: DateTime.utc().toFormat('yyyy-MM-dd HH:mm:ss'),
        };
        await client.insert({
            table: 'demo_straight_table',
            values: [row],
            format: 'JSONEachRow',
        });
    }

    const response = await client.query({
        query: 'SELECT * FROM demo_straight_table LIMIT 1',
        format: 'JSON',
    });
    const reply = await response.json();

    console.log({
        end: Date.now() - start,
        select: reply,
    });

    await client.close();
};

exec().then(() => {
    process.exit(0);
})
