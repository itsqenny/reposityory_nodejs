const bot = require("../app")
const path = require("path")
const token = require("../config/token")
const axios = require("axios")
const fs = require("fs")
const botController = require("../../controllers/bot.controller")
const getPhoto = () => {
	bot.on("message", async (msg) => {
		const userId = msg.from.id

		if (msg.text === "/start") {
			await bot
				.getUserProfilePhotos(userId, { limit: 1 })
				.then((result) => {
					const photos = result.photos

					if (photos.length > 0) {
						// Получаем объект File для изображения профиля
						const photoFile = photos[0][0]

						// Получите информацию о файле
						bot
							.getFile(photoFile.file_id)
							.then((fileInfo) => {
								const fileUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`
								//console.log("Ссылка на фото:", fileUrl)

								const downloadDir = path.join(__dirname, "downloads")
								if (!fs.existsSync(downloadDir)) {
									fs.mkdirSync(downloadDir)
								}

								const filePath = path.join(downloadDir, `photo_${userId}.jpg`)

								// Скачивание файла с использованием axios
								axios({
									method: "get",
									url: fileUrl,
									responseType: "stream",
								}).then((response) => {
									response.data.pipe(fs.createWriteStream(filePath))

									response.data.on("end", () => {
										botController
											.getPhotoId({
												userId: userId,
												filePath: filePath,
											})
											.then((result) => {
												console.log("Result:", result)
											})
											.catch((error) => {
												console.error("Error:", error)
											})
									})

									response.data.on("error", (error) => {
										console.error("Ошибка при скачивании файла:", error)
									})
								})
							})
							.catch((error) => {
								console.error("Ошибка при получении информации о файле:", error)
							})
					} else {
						console.error(
							"Пользователь не имеет фотографий профиля для команды."
						)
					}
				})
				.catch((error) => {
					console.error(
						"Ошибка при получении изображения профиля для команды",
						error
					)
				})
		}
	})
}

module.exports = getPhoto()
