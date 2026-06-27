import { DsqlSigner } from "@aws-sdk/dsql-signer";
import { Client } from "pg";

export async function getDbClient(): Promise<Client> {
  const hostname = process.env.DSQL_ENDPOINT!;
  const region = process.env.AWS_REGION || "us-east-1";

  const signer = new DsqlSigner({ hostname, region });
  const token = await signer.getDbConnectAdminAuthToken();

  const client = new Client({
    host: hostname,
    database: "postgres",
    user: "admin",
    password: token,
    port: 5432,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  return client;
}
