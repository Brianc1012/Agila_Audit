import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed Action Types for Audit Logs
 * These are the standard action types recorded in audit logs
 */
async function seedActionTypes() {
  console.log('🌱 Seeding action types...');

  const actionTypes = [
    {
      code: 'CREATE',
      description: 'Record created',
      is_active: true,
    },
    {
      code: 'UPDATE',
      description: 'Record updated',
      is_active: true,
    },
    {
      code: 'DELETE',
      description: 'Record deleted',
      is_active: true,
    },
    {
      code: 'EXPORT',
      description: 'Data exported',
      is_active: true,
    },
    {
      code: 'IMPORT',
      description: 'Data imported',
      is_active: true,
    },
    {
      code: 'LOGIN',
      description: 'User logged in',
      is_active: true,
    },
    {
      code: 'LOGOUT',
      description: 'User logged out',
      is_active: true,
    }
  ];

  for (const actionType of actionTypes) {
    await prisma.action_type.upsert({
      where: { code: actionType.code },
      update: {
        description: actionType.description,
        is_active: actionType.is_active,
      },
      create: actionType,
    });
    console.log(`✅ Action type '${actionType.code}' seeded`);
  }

  console.log('✨ Action types seeding completed!');
}

async function main() {
  try {
    await seedActionTypes();
  } catch (error) {
    console.error('❌ Error seeding action types:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
