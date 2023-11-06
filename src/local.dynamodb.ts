// This file is responsible for providing Local DynamoDB infra (in-memory) and provides an AWS SDK V3 DynamoDB client configured for it.
// References:
// * https://github.com/joemays/ts-local-dynamo (without containers)
// * https://github.com/chrisguttandin/dynamo-db-local
import { ChildProcess } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import spawnAsync from '@expo/spawn-async';
import { CreateTableCommand, CreateTableInput, DeleteTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class LocalDynamoDB {
  port: number;
  tables: CreateTableInput[];
  
  localDynamoDBProcess?: ChildProcess;

  static async setup(port: number, tables: CreateTableInput[]): Promise<LocalDynamoDB> {
    const localDynamo = new LocalDynamoDB(port, tables);
    
    await localDynamo.start();
    await localDynamo.createTables();
    
    return localDynamo;
  }

  constructor(port: number, tables: CreateTableInput[]) {
    this.port = port;
    this.tables = tables;
  }

  async start() {
    console.debug('starting local dynamodb process');
    try {
      this.localDynamoDBProcess = await spawnLocalDynamoDB(this.port);
      await sleep(3 * 1000);
    } catch (error) {
      console.error(error);

      await this.stop();
    }
  }

  async stop() { 
    console.debug('stopping local dynamodb process');

    try {
      await this.localDynamoDBProcess?.kill();
      await this.localDynamoDBProcess;
    } catch (error) {
      // Eat.
    } 
  }

  async createTables() {
    const localDynamoDBClient = this.getLocalDynamoDBClient();
    
    for (const table of this.tables) {
      console.debug(`creating local dynamodb table: ${table.TableName}`);

      try {
        await localDynamoDBClient.send(new CreateTableCommand(table));
      } catch (error) {
        console.error(error);
      }
    }
  }

  getLocalDynamoDBClient(): DynamoDBClient {
    return new DynamoDBClient({
      endpoint: `http://localhost:${this.port}`,
      region: 'local',
      credentials: {
        accessKeyId: 'fakeMyKeyId',
        secretAccessKey: 'fakeSecretAccessKey'
      }
    });
  }

  async reset() {
    console.debug('resetting local dynamodb');

    await this.deleteTables();
    await this.createTables();
  }

  async deleteTables() {
    const localDynamoDBClient = this.getLocalDynamoDBClient();

    for (const table of this.tables) {
      console.debug(`deleting local dynamodb table: ${table.TableName}`);

      try {
        await localDynamoDBClient.send(new DeleteTableCommand({ TableName: table.TableName }));
      } catch (error) {
        console.error(error);
      }
    }
  }

  async teardown() { 
    await this.deleteTables();
    await this.stop(); 
  }
}

const spawnLocalDynamoDB = async (port: number): Promise<ChildProcess> => {
  const args = [
    `-Djava.library.path=${path.resolve(__dirname, '../lib/dynamodb-local-2023-10-23/DynamoDBLocal_lib')}`,
    '-jar',
    `${path.resolve(__dirname, '../lib/dynamodb-local-2023-10-23/DynamoDBLocal.jar')}`,
    '-port',
    `${port}`,
    '-inMemory'
  ];

  console.debug('java ' + args.join(' '));

  // See: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocalTelemetry.html
  // TODO no matter what I do, DDB_LOCAL_TELEMETRY shows as enabled. FYI.
  const resultPromise = spawnAsync('java', args, { detached: true, env: { DDB_LOCAL_TELEMETRY: 'false' } });
  const spawnedChildProcess = resultPromise.child;

  return new Promise((resolve, _reject) => {
    spawnedChildProcess?.stdout?.on('data', (data) => {
      console.log(`ddb stdout: ${data}`);
      if (data.includes('Initializing DynamoDB Local')) {
        return resolve(spawnedChildProcess);
      }
    });
    spawnedChildProcess?.stderr?.on('data', (data) => {
      console.error(`ddb stderr: ${data}`);
      
      //return reject();
    });
  });
};

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
}