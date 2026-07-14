import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { AssignCardDto, UnassignCardDto } from './dto/assign-card.dto';
import { ScanCardDto } from './dto/scan-card.dto';
export declare class CardsController {
    private readonly cards;
    constructor(cards: CardsService);
    create(dto: CreateCardDto): Promise<any>;
    findAll(page?: string, limit?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    findByUid(uid: string): Promise<any>;
    updateStatus(uid: string, status: 'BLOCKED' | 'ACTIVE'): Promise<any>;
    assignCard(dto: AssignCardDto): Promise<any>;
    unassignCard(dto: UnassignCardDto): Promise<{
        message: string;
    }>;
    scan(dto: ScanCardDto): Promise<import("./dto/scan-card.dto").ScanResponse>;
}
