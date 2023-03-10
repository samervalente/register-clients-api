import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';

import { ClientService } from '../../services/client.service';

@Controller('/clients')
export class ClientController {
  constructor(private clientService: ClientService) {}

  @Post()
  async create(@Res() res: Response): Promise<void> {
    const validBody = res.locals.client;

    const client = await this.clientService.create(validBody);
    res.status(HttpStatus.CREATED).send({
      statusCode: 201,
      response: 'Client registered sucessfully',
      client,
    });
  }

  @Get()
  async getAll(
    @Query('page') page = 1,
    @Query('limit') limit = 40,
    @Res() res: Response,
  ) {
    const clients = await this.clientService.getAll(page, limit);
    res.send(clients).status(HttpStatus.OK);
  }

  @Get(':cpf')
  async getByCPF(@Param() params: { cpf: string }, @Res() res: Response) {
    const client = await this.clientService.getByCPF(params.cpf);
    res.send(client).status(HttpStatus.OK);
  }
}
