import { spawn } from 'child_process';

// Set environment variables for the application
process.env.ENVIRONMENT = 'prod';
process.env.NODE_ENV = 'development';

async function runMigrations() {
  return new Promise((resolve, reject) => {
    console.log('Running migrations...');
    const migrations = spawn('node', ['/app/dist/migrations.mjs']);
    
    migrations.on('exit', (code) => {
      if (code === 0) {
        console.log('Migrations completed successfully');
        resolve();
      } else {
        console.error(`Migrations failed with exit code ${code}`);
        reject(new Error(`Migrations exited with code ${code}`));
      }
    });

    migrations.on('error', (err) => {
      console.error(`Failed to start migrations: ${err}`);
      reject(err);
    });
  });
}

async function startServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting server with source maps enabled...');
    const server = spawn('node', ['--enable-source-maps', '/app/dist/server.mjs'], {
      stdio: 'inherit'
    });
    
    server.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Server exited with code ${code}`));
      }
    });

    server.on('error', (err) => {
      console.error(`Failed to start server: ${err}`);
      reject(err);
    });
  });
}

async function main() {
  try {
    await runMigrations();
    await startServer();
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

main();