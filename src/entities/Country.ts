import { IsNotEmpty } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Address } from './Address';

@Entity()
export class Country {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Column()
    @IsNotEmpty()
    public name: string;

    @OneToMany((type) => Address, (address) => address.country)
    public addresses: Address[];
}
