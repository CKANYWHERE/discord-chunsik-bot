const { SlashCommandBuilder } = require("@discordjs/builders")
const { MessageEmbed } = require("discord.js")
const { QueryType } = require("discord-player")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("play")
		.setDescription("유튭에서 노래를 가져와서 재생한다.")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("song")
				.setDescription("url을 가져와서 노래를 재생한다.")
				.addStringOption((option) => option.setName("url").setDescription("노래 url").setRequired(true))
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("playlist")
				.setDescription("여러 url을 가져와서 노래를 재생한다.")
				.addStringOption((option) => option.setName("url").setDescription("플레이리스트 url").setRequired(true))
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("search")
				.setDescription("노래를 검색하여 재생한다.")
				.addStringOption((option) =>
					option.setName("keyword").setDescription("검색키워드").setRequired(true)
				)
		),
	run: async ({ client, interaction }) => {
		if (!interaction.member.voice.channel) return interaction.editReply("보이스 채널에 들어간 다음에 명령어를 입력하세요")

		const queue = await client.player.createQueue(interaction.guild)
		if (!queue.connection) await queue.connect(interaction.member.voice.channel)

		let embed = new MessageEmbed()

		if (interaction.options.getSubcommand() === "song") {
			let url = interaction.options.getString("url")
			const result = await client.player.search(url, {
				requestedBy: interaction.user,
				searchEngine: QueryType.YOUTUBE_VIDEO
			})
			if (result.tracks.length === 0)
				return interaction.editReply("결과가 없습니다.")

			const song = result.tracks[0]
			await queue.addTrack(song)
			embed
				.setDescription(`**[${song.title}](${song.url})** 큐에 들어감`)
				.setThumbnail(song.thumbnail)
				.setFooter({ text: `Duration: ${song.duration}`})

		} else if (interaction.options.getSubcommand() === "playlist") {
			let url = interaction.options.getString("url")
			const result = await client.player.search(url, {
				requestedBy: interaction.user,
				searchEngine: QueryType.YOUTUBE_PLAYLIST
			})

			if (result.tracks.length === 0)
				return interaction.editReply("No results")

			const playlist = result.playlist
			await queue.addTracks(result.tracks)
			embed
				.setDescription(`**${result.tracks.length} songs from [${playlist.title}](${playlist.url})** 큐에 들어감`)
				.setThumbnail(playlist.thumbnail)
		} else if (interaction.options.getSubcommand() === "search") {
			let url = interaction.options.getString("keyword")
			const result = await client.player.search(url, {
				requestedBy: interaction.user,
				searchEngine: QueryType.AUTO
			})

			if (result.tracks.length === 0)
				return interaction.editReply("결과 없음")

			const song = result.tracks[0]
			await queue.addTrack(song)
			embed
				.setDescription(`**[${song.title}](${song.url})** 큐에 들어감`)
				.setThumbnail(song.thumbnail)
				.setFooter({ text: `Duration: ${song.duration}`})
		}
		if (!queue.playing) await queue.play()
		await interaction.editReply({
			embeds: [embed]
		})
	},
}