import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { DataModule } from 'src/data/data.module';

@Module({
  imports: [DataModule],
  providers: [WebsocketGateway],
})
export class WebsocketModule {}
