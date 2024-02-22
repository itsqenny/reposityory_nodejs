const db = require("../DB/db")
class BotController {
	async createUser({ userId, first_name, last_name, username }) {
		const user = await db.query(
			'INSERT INTO "Users" ("userId", "first_name", "last_name", "username", "createdAt", "updatedAt") values ($1, $2, $3, $4, NOW(), NOW()) ON CONFLICT ("userId") DO UPDATE SET "first_name" = $2, "last_name" = $3, "username" = $4 RETURNING *',
			[userId, first_name, last_name, username]
		)
		return user.rows[0]
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
