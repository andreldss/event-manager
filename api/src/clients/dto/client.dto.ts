export class CreateClientDto {
    name: string
    phone: string
    notes: string
}

export class UpdateClientDto {
    name?: string;
    phone?: string;
    notes?: string;
};
