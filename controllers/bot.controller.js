const db = require("../DB/db")
class BotController {
	async createUser({ userId, first_name, last_name, username }) {
		const existingUser = await db.query(
			'SELECT * FROM "Users" WHERE "userId" = $1',
			[userId]
		)

		if (existingUser.rows.length > 0) {
			const updateUser = await db.query(
				'UPDATE "Users" SET "first_name" = $2, "last_name" = $3, "username" = $4 WHERE "userId" = $1 RETURNING *',
				[userId, first_name, last_name, username]
			)

			if (!existingUser.rows[0].startBonus) {
				const updateBonus = await db.query(
					'UPDATE "Users" SET "userBonus" = 500, "startBonus" = true WHERE "userId" = $1 RETURNING *',
					[userId]
				)

				return updateBonus.rows[0]
			} else {
				return updateUser.rows[0]
			}
		} else {
			// Если пользователь не существует, создаем нового с бонусами
			const newUser = await db.query(
				'INSERT INTO "Users" ("userId", "first_name", "last_name", "username", "userBonus", "startBonus", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, 500, true, NOW(), NOW()) RETURNING *',
				[userId, first_name, last_name, username]
			)

			return newUser.rows[0]
		}
	}
	async getPhotoId({ userId, filePath }) {
		const user = await db.query(
			'INSERT INTO "Users" ("userId", "filePath", "createdAt", "updatedAt") values ($1, $2, NOW(), NOW()) ON CONFLICT ("userId") DO UPDATE SET "filePath" = $2 RETURNING *',
			[userId, filePath]
		)
		return user.rows[0]
	}
	async getReferralId({ referralCode }) {
		const referral = await db.query(
			'SELECT * FROM "Users" WHERE "userId" = $1',
			[referralCode.toString()]
		)
		return referral.rows[0]
	}

	async getAnotherReferralId({ referralId }) {
		const another = await db.query(
			'SELECT * FROM "Users" WHERE "referralId" LIKE $1',
			[`%${referralId}%`]
		)
		return another.rows
	}

	async updateReferralId({ referralCode, updatedReferrals }) {
		await db.query('UPDATE "Users" SET "referralId" = $1 WHERE "userId" = $2', [
			JSON.stringify(updatedReferrals),
			referralCode.toString(),
		])
	}
}

module.exports = new BotController()
