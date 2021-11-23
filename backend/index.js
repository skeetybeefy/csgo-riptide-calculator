import fetch from "node-fetch"
import jsdom from "jsdom"
import express from "express"
import cors from "cors"

const app = express()
app.use(cors())
const port = 8069

const {JSDOM} = jsdom

const CASE = "https://csgostash.com/case/321/Operation-Riptide-Case"
const PATCHES = "https://csgostash.com/patches/Operation+Riptide+Patch+Collection"
const AGENTS = "https://csgostash.com/agents/Operation+Riptide+Agents"


class Price {
    constructor() {

    }
    static convert(str) { // to number type with decimal points 
        str = str.split(",").join(".")
        return Number(str)
    }
}


async function getCasePrice(url) {
    const response = await fetch(url)
    const text = await response.text()
    const dom = new JSDOM(text)

    const elems = dom.window.document.getElementsByClassName("btn btn-default market-button-item")

    const item = {
        "name": "Operation Riptide Case",
        "price": Price.convert(elems[0].innerHTML.split(" ")[0]),
        "imgLink": elems[0].parentNode.parentNode.querySelector("img").getAttribute("src")
    }

    return item
}


async function getCollectionData(url) {
    const response = await fetch(url)
    const text = await response.text()
    const dom = new JSDOM(text)

    const elems = dom.window.document.getElementsByClassName("well result-box nomargin")

    // remove the ad container(s) among items

    let itemsData = Array.from(elems).filter((elem) => {
        return !elem.parentNode.className.includes("adv-result-box-agents")
    })

    itemsData = itemsData.reduce((acc, elem) => {
        let item = {}

        item["name"] = elem.querySelector("h3").querySelector("a").text
        item["rarity"] = elem.querySelector(".quality").className.split("-")[1]
        item["price"] = Price.convert(elem.querySelector(".price").querySelector("a").innerHTML.split(" ")[0])
        item["imgLink"] = elem.querySelector("img").getAttribute("src")

        acc.push(item)
        return acc
    }, [])

    return itemsData
}


function splitAgents(agentsData) {
    let covertAgentsT = agentsData.filter((agent) => {
        return (agent.rarity === "covert") && (agent.name.includes("Guerrilla Warfare"))
    })

    let covertAgentsCT = agentsData.filter((agent) => {
        return (agent.rarity === "covert") && !(agent.name.includes("Guerrilla Warfare"))
    })

    let classifiedAgents = agentsData.filter((agent) => {
        return agent.rarity === "classified"
    })

    let restrictedAgents = agentsData.filter((agent) => {
        return agent.rarity === "restricted"
    })

    let milspecAgents = agentsData.filter((agent) => {
        return agent.rarity === "milspec"
    })

    return [covertAgentsT, covertAgentsCT, classifiedAgents, restrictedAgents, milspecAgents]
}


function getSortedRewards(caseObj, covertAgentsT, covertAgentsCT, classifiedAgents, restrictedAgents, milspecAgents, patches) {
    let rewards = []

    function sumPatchesRarities(rarities) {
        return rarities.reduce((outerAcc, rarity) => {

            let rarityProbability

            switch (rarity) {
                case "classified":
                    rarityProbability = 1 / 31
                    break;
                case "restricted":
                    rarityProbability = 5 / 31
                    break;
                case "milspec":
                    rarityProbability = 25 / 31
                    break;
            }

            let filtered = patches.filter(patch => patch.rarity === rarity)
            outerAcc += filtered.reduce((acc, patch) => {
                acc += patch.price / filtered.length
                return acc
            }, 0) * rarityProbability
            return outerAcc
        }, 0)
    }

    let patchesRewards = sumPatchesRarities(["classified", "restricted", "milspec"])

    rewards.push({
        "type": "Case",
        "reward": caseObj.price / 2,
        "imgLink": caseObj.imgLink
    },
    {
        "type": "Covert T agents",
        "reward": covertAgentsT.reduce((acc, agent) => {
            acc += agent.price / 25
            return acc
        }, 0) / covertAgentsT.length,
        "imgLink": covertAgentsT[0].imgLink
    },
    {
        "type": "Covert CT Agents",
        "reward": covertAgentsCT.reduce((acc, agent) => {
            acc += agent.price / 25
            return acc
        }, 0) / covertAgentsCT.length,
        "imgLink": covertAgentsCT[0].imgLink
    },
    {
        "type": "Classified Agents",
        "reward": classifiedAgents.reduce((acc, agent) => {
            acc += agent.price / 10
            return acc
        }, 0) / classifiedAgents.length,
        "imgLink": classifiedAgents[0].imgLink
    },
    {
        "type": "Restricted Agents",
        "reward": restrictedAgents.reduce((acc, agent) => {
            acc += agent.price / 7
            return acc
        }, 0) / restrictedAgents.length,
        "imgLink": restrictedAgents[0].imgLink
    },
    {
        "type": "Mil-Spec Agents",
        "reward": milspecAgents.reduce((acc, agent) => {
            acc += agent.price / 5
            return acc
        }, 0) / milspecAgents.length,
        "imgLink": milspecAgents[0].imgLink
    },
    {
        "type": "Patches",
        "reward": patchesRewards,
        "imgLink": patches[0].imgLink
    })

    rewards.sort((a, b) => {
        return b.reward - a.reward
    })

    return rewards
}


let sorted = getSortedRewards(
    await getCasePrice(CASE),
    ...splitAgents(await getCollectionData(AGENTS)),
    await getCollectionData(PATCHES)
)

console.log(sorted)

app.get("/", (req, res) => {
    res.send("OK")
})

app.get("/data", async (req, res) => {
    res.send(getSortedRewards(
        await getCasePrice(CASE),
        ...splitAgents(await getCollectionData(AGENTS)),
        await getCollectionData(PATCHES)
    ))
})

app.listen(process.env.PORT || port, () => {
    console.log("Server has been started")
})