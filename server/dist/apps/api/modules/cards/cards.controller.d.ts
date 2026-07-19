import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { AssignCardDto, UnassignCardDto } from './dto/assign-card.dto';
import { ScanCardDto } from './dto/scan-card.dto';
export declare class CardsController {
    private readonly cards;
    constructor(cards: CardsService);
    create(dto: CreateCardDto): Promise<{
        success: boolean;
        data: any;
    }>;
    findAll(page?: string, limit?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        success: boolean;
    }>;
    findByUid(uid: string): Promise<{
        success: boolean;
        data: any;
    }>;
    updateStatus(uid: string, status: 'BLOCKED' | 'ACTIVE'): Promise<{
        success: boolean;
        data: any;
    }>;
    assignCard(dto: AssignCardDto): Promise<{
        success: boolean;
        data: any;
    }>;
    unassignCard(dto: UnassignCardDto): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    scan(dto: ScanCardDto): Promise<import("./dto/scan-card.dto").ScanResponse>;
}
