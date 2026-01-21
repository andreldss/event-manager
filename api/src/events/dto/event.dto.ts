export class CreateEventDto {
    name: string
    type: string
    date: string
    location: string
    notes?: string
    clientId: number
}