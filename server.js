import 'tsx';
import('./server.ts').catch(err => {
    console.error('Error starting server', err);
    process.exit(1);
});
