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
exports.UnassignCardDto = exports.AssignCardDto = void 0;
const class_validator_1 = require("class-validator");
class AssignCardDto {
    cardUid;
    userId;
}
exports.AssignCardDto = AssignCardDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignCardDto.prototype, "cardUid", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignCardDto.prototype, "userId", void 0);
class UnassignCardDto {
    cardUid;
}
exports.UnassignCardDto = UnassignCardDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UnassignCardDto.prototype, "cardUid", void 0);
//# sourceMappingURL=assign-card.dto.js.map