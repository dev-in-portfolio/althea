import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DeviceKeyGuard } from '../authlite/device-key.guard';
import { CreateDocumentDto } from './dto/create-document.dto';

@Controller('api/documents')
@UseGuards(DeviceKeyGuard)
export class DocumentsController {
  constructor(private documents: DocumentsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateDocumentDto) {
    return this.documents.createDocument(req.userId, dto.title);
  }

  @Get()
  list(@Req() req: any) {
    return this.documents.listDocuments(req.userId);
  }

  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) {
    return this.documents.getDocument(req.userId, id);
  }

  @Delete(':id')
  delete(@Req() req: any, @Param('id') id: string) {
    return this.documents.deleteDocument(req.userId, id);
  }
}
