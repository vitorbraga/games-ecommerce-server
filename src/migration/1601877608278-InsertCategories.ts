import { getRepository, MigrationInterface, QueryRunner } from 'typeorm';
import { Category } from '../entity/Category';

export class InsertCategories1601877608278 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('Starting InsertCategories up.');
        const categoriesRepository = getRepository(Category);

        // Games
        const games = new Category();
        games.key = 'games';
        games.label = 'Games';
        const gamesRoot = await categoriesRepository.save(games);

        const gamesPs4 = new Category();
        gamesPs4.key = 'games-ps4';
        gamesPs4.label = 'PlayStation 4';
        gamesPs4.parent = gamesRoot;
        await categoriesRepository.save(gamesPs4);

        const gamesXbox = new Category();
        gamesXbox.key = 'games-xbox';
        gamesXbox.label = 'Xbox One';
        gamesXbox.parent = gamesRoot;
        await categoriesRepository.save(gamesXbox);

        // Consoles
        const consoles = new Category();
        consoles.key = 'consoles';
        consoles.label = 'Consoles';
        const consolesRoot = await categoriesRepository.save(consoles);

        const consolesPs4 = new Category();
        consolesPs4.key = 'consoles-ps4';
        consolesPs4.label = 'PlayStation 4';
        consolesPs4.parent = consolesRoot;
        await categoriesRepository.save(consolesPs4);

        const consolesXbox = new Category();
        consolesXbox.key = 'consoles-xbox';
        consolesXbox.label = 'Xbox One';
        consolesXbox.parent = consolesRoot;
        await categoriesRepository.save(consolesXbox);

        console.log('Finished InsertCategories up.');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('InsertCategories down.');
    }
}
