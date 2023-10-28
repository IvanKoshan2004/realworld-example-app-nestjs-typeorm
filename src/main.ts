import { ConfigService } from '@nestjs/config';
import { bootstrap } from './app-bootstrap';

async function main() {
  const app = await bootstrap();
  const configService = app.get(ConfigService);
  const PORT = configService.get<string>('PORT');
  await app.listen(PORT || 3000);
}
main();
