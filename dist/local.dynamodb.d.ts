/// <reference types="node" />
import { ChildProcess } from 'child_process';
import { CreateTableInput, DynamoDBClient } from '@aws-sdk/client-dynamodb';
export declare class LocalDynamoDB {
    port: number;
    tables: CreateTableInput[];
    localDynamoDBProcess?: ChildProcess;
    static setup(port: number, tables: CreateTableInput[]): Promise<LocalDynamoDB>;
    constructor(port: number, tables: CreateTableInput[]);
    start(): Promise<void>;
    stop(): Promise<void>;
    createTables(): Promise<void>;
    getLocalDynamoDBClient(): DynamoDBClient;
    reset(): Promise<void>;
    deleteTables(): Promise<void>;
    teardown(): Promise<void>;
}
//# sourceMappingURL=local.dynamodb.d.ts.map