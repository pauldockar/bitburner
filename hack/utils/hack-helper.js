import { TreeNode } from '/classes/tree-node.js'
import { treeSearchAlgorithm } from '/utils/tree-search-algorithm.js'
import { isRamAvailable, getCpuCores } from '/utils/server-info.js'
import { weakenScriptPath, growthScriptPath } from '/hack/utils/file-locations.js'

/**
 * 
 * @param {NS} ns 
 * @returns {array}
 */
export function getServersFromParams(ns) {
    let arg = ns.args[0];
    if (arg == null) {
        ns.tprint("Please include argument; server.hostname or 'all'");
        ns.exit();
    }

    let serverList = [];

    if (arg == "all") {
        serverList = treeSearchAlgorithm(ns);
    } else {
        let server = new TreeNode(arg);
        serverList.push(server);
    }
    return serverList;
}

/**
 * 
 * @param {NS} ns 
 * @param {Server} server 
 * @param {Player} player 
 * @param {number} previousScriptTime 
 * @returns 
 */
export async function weakenServer(ns, server, player, previousScriptTime, delayTime, securityIncrease) {
    const HOST = ns.getHostname();
    const WEAKEN_RAM = ns.getScriptRam(weakenScriptPath);
    const MAX_RAM = ns.getServerMaxRam(HOST);
    const USED_RAM = ns.getServerUsedRam(HOST);

    let [weakenThreads, weakenTime] = getWeakenInfo(ns, server, player, securityIncrease);

    let waitTime = Math.ceil(getWaitTime(previousScriptTime, weakenTime, delayTime));

    let pid = 0;
    if (isRamAvailable(weakenThreads, MAX_RAM, USED_RAM, WEAKEN_RAM)) {
        ns.tprint("weakenThreads = " + weakenThreads + " target = " + server.hostname + " waitTime = " + waitTime);
        pid = ns.exec(weakenScriptPath, HOST, weakenThreads, server.hostname, waitTime);
    } else {
        await ns.sleep(1e4);
    }

    return [waitTime, weakenTime, pid];
}

/**
 * 
 * @param {NS} ns 
 * @param {Server} server 
 * @param {Player} player 
 * @param {number} previousScriptTime 
 * @returns 
 */
export async function growServer(ns, server, player, previousScriptTime, delayTime) {
    const HOST = ns.getHostname();
    const CPU_CORES = getCpuCores(ns, HOST);
    const GROW_RAM = ns.getScriptRam(growthScriptPath);
    const MAX_RAM = ns.getServerMaxRam(HOST);
    const USED_RAM = ns.getServerUsedRam(HOST);

    let [growthThreads, growthTime] = getGrowthInfo(ns, server, player, CPU_CORES);

    let waitTime = Math.ceil(getWaitTime(previousScriptTime, growthTime, delayTime));
    let securityIncrease = ns.growthAnalyzeSecurity(growthThreads);

    let pid = 0;
    if (isRamAvailable(growthThreads, MAX_RAM, USED_RAM, GROW_RAM)) {
        pid = ns.exec(growthScriptPath, HOST, growthThreads, server.hostname, waitTime);
    } else {
        await ns.sleep(1e4);
    }

    return [waitTime, securityIncrease, growthTime, pid];
}

/**
 * 
 * @param {NS*} ns 
 * @param {Server} server 
 * @param {number} CPU_CORES 
 * @param {Player} player 
 * @returns {array}
 */
export function getWeakenInfo(ns, server, player, securityIncrease) {
    const CPU_CORES = getCpuCores(ns);

    let weakenThreads = getWeakenThreads(ns, server, CPU_CORES, securityIncrease);
    let weakenTime = Math.round(ns.formulas.hacking.weakenTime(server, player));
    return [weakenThreads, weakenTime];
}

/**
 * 
 * @param {NS} ns 
 * @param {Server} server 
 * @param {Player} player 
 * @param {number} CPU_CORES 
 * @returns {array}
 */
export function getGrowthInfo(ns, server, player, CPU_CORES) {
    let growthThreads = getGrowThreads(ns, server, player, CPU_CORES);
    let growthTime = Math.round(ns.formulas.hacking.growTime(server, player));
    return [growthThreads, growthTime];
}

/**
 * 
 * @description 
 * @param {NS} ns
 * @param {Node} server
 * @param {number} cores
 * @param {number} securityIncrease 
 * @returns 
 */
export function getWeakenThreads(ns, server, cores, securityIncrease) {
    let weakenThreads = 1;
    let securityDifference = server.hackDifficulty - server.minDifficulty;
    let securityDecrease;

    if (securityIncrease > 0) securityDifference = securityIncrease

    do {
        securityDecrease = ns.weakenAnalyze(weakenThreads, cores);
        weakenThreads += 1;
    } while (securityDifference > securityDecrease);
    return weakenThreads;
}

/** 
 * @description 
 * @param  {NS} ns
 * @param  {Node} server
 * @param  {number} cores
 * @returns {number}
 */
export function getGrowThreads(ns, server, player, cores) {
    let estimatedGrowthMultiplier = Math.ceil(server.moneyMax / (server.moneyAvailable + 1));

    let growthThreads = 1;
    let growthPercent;
    do {
        growthPercent = ns.formulas.hacking.growPercent(server, growthThreads, player, cores);
        growthThreads += 1;
    } while (estimatedGrowthMultiplier > growthPercent / 100);
    return growthThreads;
}

/**
 * @description Returns negligible wait time if a < b, otherwise returns the difference. 
 * @param {number} a 
 * @param {number} b 
 * @returns {number}
 */
export function getWaitTime(a, b, c) {
    let waitTime;
    if (b < c) {
        waitTime = c - b;
    } else if (a < b) {
        waitTime = c;
    } else {
        waitTime = a - b;
    }
    return waitTime + 20;
}