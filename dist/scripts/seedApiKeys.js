"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = __importDefault(require("../prisma/client"));
const hash_util_1 = require("../utils/hash.util");
dotenv_1.default.config();
const defaultApiKeys = [
    {
        serviceName: 'finance',
        rawKey: process.env.FINANCE_API_KEY || 'FINANCE_DEFAULT_KEY',
        description: 'Finance microservice API key',
        canWrite: true,
        canRead: false,
    },
    {
        serviceName: 'hr',
        rawKey: process.env.HR_API_KEY || 'HR_DEFAULT_KEY',
        description: 'HR microservice API key',
        canWrite: true,
        canRead: false,
    },
    {
        serviceName: 'inventory',
        rawKey: process.env.INVENTORY_API_KEY || 'INVENTORY_DEFAULT_KEY',
        description: 'Inventory microservice API key',
        canWrite: true,
        canRead: false,
    },
    {
        serviceName: 'operations',
        rawKey: process.env.OPERATIONS_API_KEY || 'OPERATIONS_API_KEY',
        description: 'Operations microservice API key',
        canWrite: true,
        canRead: false,
    },
];
async function seedApiKeys() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌱 Seeding API Keys...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    try {
        for (const keyConfig of defaultApiKeys) {
            const keyHash = (0, hash_util_1.hashValue)(keyConfig.rawKey);
            const existingKey = await client_1.default.apiKey.findUnique({
                where: { keyHash },
            });
            if (existingKey) {
                console.log(`⏭️  Skipping ${keyConfig.serviceName} - Key already exists`);
                continue;
            }
            const apiKey = await client_1.default.apiKey.create({
                data: {
                    keyHash,
                    serviceName: keyConfig.serviceName,
                    description: keyConfig.description,
                    canWrite: keyConfig.canWrite,
                    canRead: keyConfig.canRead,
                    isActive: true,
                    createdBy: 'system',
                },
            });
            console.log(`✅ Created API key for ${keyConfig.serviceName} (ID: ${apiKey.id})`);
            console.log(`   Raw Key: ${keyConfig.rawKey}`);
            console.log(`   Hash: ${keyHash.substring(0, 16)}...`);
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ API Keys seeded successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n⚠️  IMPORTANT: Save these raw keys securely!');
        console.log('These keys will be used by other microservices to authenticate.');
    }
    catch (error) {
        console.error('❌ Error seeding API keys:', error);
        throw error;
    }
    finally {
        await client_1.default.$disconnect();
    }
}
if (require.main === module) {
    seedApiKeys()
        .then(() => {
        process.exit(0);
    })
        .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
exports.default = seedApiKeys;
