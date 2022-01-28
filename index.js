const fs = require("fs-extra")
const path = require("path")
const nbt = require("prismarine-nbt")
const { AsciiTable3, AlignmentEnum } = require("ascii-table3")
const prettyMs = require("pretty-ms")

const config = require("./config.json")
const { worldPath, outputPath, statName, tableTitle } = config

const main = async () => {
  const playerStats = await getStats()

  const rowMatrix = []
  for(const uuid in playerStats) {
    const username = await getLastKnownUsername(uuid)
    const ticks = playerStats[uuid]["minecraft:custom"][statName]
    const humanReadableTime = prettyMs(ticks * 50, {
      secondsDecimalDigits: 0,
      colonNotation: true,
    })

    rowMatrix.push([
      username,
      ticks,
      humanReadableTime,
    ])
  }

  const table = new AsciiTable3(tableTitle)
    .setHeading("Username", "Ticks", "D:H:M:S")
    .setAlign(3, AlignmentEnum.RIGHT)
    .addRowMatrix(rowMatrix)
    .sort((a, b) => b[1] - a[1]) // sort playtime descending

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFile(outputPath, table.toString())
}


const getLastKnownUsername = async uuid => {
  const fileData = await fs.readFile(path.join(worldPath, "playerdata", uuid + ".dat"))
    .catch(err => console.error(err))

  const { parsed } = await nbt.parse(fileData)
  const simplifiedNbt = nbt.simplify(parsed)
  
  return simplifiedNbt.bukkit.lastKnownName
}


const getStats = async () => {
  const joinedDir = path.join(worldPath, "stats")
  const childrenNames = await fs.readdir(joinedDir)

  const allStats = {}
  for(const fileName of childrenNames) {
    const content = await fs.readFile(path.join(joinedDir, fileName), "utf-8")
    const parsedJson = JSON.parse(content)

    const uuid = fileName.split(".")[0]
    allStats[uuid] = parsedJson.stats
  }

  return allStats
}

main()