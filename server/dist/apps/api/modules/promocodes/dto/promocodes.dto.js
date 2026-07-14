"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedeemPromoCodeDto = exports.UpdatePromoCodeDto = exports.CreatePromoCodeDto = void 0;
const class_validator_1 = require("class-validator");
class CreatePromoCodeDto {
    code;
    type;
    value;
    usageLimit;
    validFrom;
    validTo;
    isActive;
}
exports.CreatePromoCodeDto = CreatePromoCodeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreatePromoCodeDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['PERCENT', 'FIXED']),
    __metadata("design:type", String)
], CreatePromoCodeDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(99999999.99),
    __metadata("design:type", Number)
], CreatePromoCodeDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePromoCodeDto.prototype, "usageLimit", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePromoCodeDto.prototype, "validFrom", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePromoCodeDto.prototype, "validTo", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreatePromoCodeDto.prototype, "isActive", void 0);
class UpdatePromoCodeDto {
    type;
    value;
    usageLimit;
    validFrom;
    validTo;
    isActive;
}
exports.UpdatePromoCodeDto = UpdatePromoCodeDto;
__decorate([
    (0, class_validator_1.IsEnum)(['PERCENT', 'FIXED']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePromoCodeDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(99999999.99),
    __metadata("design:type", Number)
], UpdatePromoCodeDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePromoCodeDto.prototype, "usageLimit", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePromoCodeDto.prototype, "validFrom", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePromoCodeDto.prototype, "validTo", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdatePromoCodeDto.prototype, "isActive", void 0);
class RedeemPromoCodeDto {
    code;
    purchaseAmount;
}
exports.RedeemPromoCodeDto = RedeemPromoCodeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], RedeemPromoCodeDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RedeemPromoCodeDto.prototype, "purchaseAmount", void 0);
//# sourceMappingURL=promocodes.dto.js.map