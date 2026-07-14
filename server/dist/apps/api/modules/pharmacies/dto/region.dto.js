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
exports.UpdateDistrictDto = exports.UpdateRegionDto = exports.CreateDistrictDto = exports.CreateRegionDto = void 0;
const class_validator_1 = require("class-validator");
class CreateRegionDto {
    name;
    code;
}
exports.CreateRegionDto = CreateRegionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateRegionDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(10),
    __metadata("design:type", String)
], CreateRegionDto.prototype, "code", void 0);
class CreateDistrictDto {
    regionId;
    name;
}
exports.CreateDistrictDto = CreateDistrictDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateDistrictDto.prototype, "regionId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateDistrictDto.prototype, "name", void 0);
class UpdateRegionDto {
    name;
    code;
}
exports.UpdateRegionDto = UpdateRegionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(120),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateRegionDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(10),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateRegionDto.prototype, "code", void 0);
class UpdateDistrictDto {
    name;
}
exports.UpdateDistrictDto = UpdateDistrictDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(120),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateDistrictDto.prototype, "name", void 0);
//# sourceMappingURL=region.dto.js.map