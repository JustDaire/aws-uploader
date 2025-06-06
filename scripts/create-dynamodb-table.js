#!/usr/bin/env node

const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const TABLE_NAME = process.env.DYNAMODB_PHOTO_TABLE || "photo-gallery";

async function createPhotoTable() {
    try {
        // Check if table already exists
        try {
            const describeCommand = new DescribeTableCommand({ TableName: TABLE_NAME });
            await client.send(describeCommand);
            console.log(`✅ Table '${TABLE_NAME}' already exists`);
            return;
        } catch (error) {
            if (error.name !== 'ResourceNotFoundException') {
                throw error;
            }
        }

        console.log(`🚀 Creating DynamoDB table: ${TABLE_NAME}`);

        const createTableCommand = new CreateTableCommand({
            TableName: TABLE_NAME,
            KeySchema: [
                {
                    AttributeName: "id",
                    KeyType: "HASH"
                }
            ],
            AttributeDefinitions: [
                {
                    AttributeName: "id",
                    AttributeType: "S"
                }
            ],
            BillingMode: "PAY_PER_REQUEST", // On-demand pricing
            Tags: [
                {
                    Key: "Project",
                    Value: "PhotoGallery"
                },
                {
                    Key: "Environment",
                    Value: process.env.NODE_ENV || "development"
                }
            ]
        });

        const result = await client.send(createTableCommand);
        console.log("✅ Table created successfully!");
        console.log(`📋 Table ARN: ${result.TableDescription.TableArn}`);
        console.log(`⏰ Creation time: ${result.TableDescription.CreationDateTime}`);

        // Wait for table to be active
        console.log("⏳ Waiting for table to be active...");
        let tableStatus = "CREATING";
        while (tableStatus !== "ACTIVE") {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const describeCommand = new DescribeTableCommand({ TableName: TABLE_NAME });
            const description = await client.send(describeCommand);
            tableStatus = description.Table.TableStatus;
            console.log(`📊 Table status: ${tableStatus}`);
        }

        console.log("🎉 Table is now active and ready to use!");

    } catch (error) {
        console.error("❌ Error creating table:", error);
        process.exit(1);
    }
}

// Environment variables check
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("❌ Missing AWS credentials. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY");
    process.exit(1);
}

console.log("🔧 DynamoDB Photo Gallery Table Setup");
console.log(`🌍 Region: ${process.env.AWS_REGION || "us-east-1"}`);
console.log(`📄 Table Name: ${TABLE_NAME}`);
console.log("");

createPhotoTable(); 