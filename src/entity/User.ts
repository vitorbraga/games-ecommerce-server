import { Entity, PrimaryGeneratedColumn, Column, Unique, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { IsNotEmpty, MinLength, IsEmail } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { PasswordReset } from './PasswordReset';
import { UserProduct } from './UserProduct';

@Entity()
@Unique(['email'])
export class User {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    @IsEmail({}, { message: 'REGISTER_INVALID_EMAIL' })
    public email: string;

    @Column()
    public firstName: string;

    @Column()
    public lastName: string;

    @Column()
    @MinLength(6, { message: 'REGISTER_PASSWORD_SIX_CHARS' })
    public password: string;

    @Column()
    @IsNotEmpty()
    public role: string;

    @Column()
    @CreateDateColumn()
    public createdAt: Date;

    @Column()
    @UpdateDateColumn()
    public updatedAt: Date;

    @OneToMany((type) => PasswordReset, (passwordReset) => passwordReset.user, { cascade: true })
    public passwordResets: PasswordReset[];

    @OneToMany((type) => UserProduct, (userProduct) => userProduct.user)
    public userProducts!: UserProduct[];

    hashPassword() {
        this.password = bcrypt.hashSync(this.password, 8);
    }

    checkIfUnencryptedPasswordIsValid(unencryptedPassword: string) {
        return bcrypt.compareSync(unencryptedPassword, this.password);
    }
}
