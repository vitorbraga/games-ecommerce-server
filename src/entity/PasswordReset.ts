import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Unique } from 'typeorm';
import { User } from './User';

@Entity()
@Unique(['token'])
export class PasswordReset {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public token: string;

    @Column()
    @CreateDateColumn()
    public createdAt: Date;

    @Column()
    @UpdateDateColumn()
    public updatedAt: Date;

    @ManyToOne((type) => User, (user) => user.passwordResets)
    public user: User;
}
