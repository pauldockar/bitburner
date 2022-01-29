import { treeSearchAlgorithm } from '/utils/tree-search-algorithm.js';
import { sortMap } from '/utils/array-sort.js'
//import { Server } from '/classes/server.js';


/** @param {NS} ns **/
export async function main(ns) {
    let serverList = treeSearchAlgorithm(ns);
    for (let server of serverList) {
        ns.tprint("Name: " + server.hostname + ". Child: " + server.children + ". Parent: " + server.parent);
    }
    let serverList = find(ns, serverList);
}

/** 
 * @param  {NS} ns
 * @param  {Array<Object>} list 
 * @returns {String} string
 */
export function find(ns, list) {
    let map = new Map();
    for (let node of list) {
        let player = ns.getPlayer();
        let server = ns.getServer();
        let hackAnalyzeChance = ns.hackAnalyzeChance(node.hostname);
        let maxMoney = ns.getServerMaxMoney(node.hostname);
        let weakenTime = ns.getWeakenTime(node.hostname);
        let score = Math.round((maxMoney * hackAnalyzeChance) / weakenTime);

        map.set(node.hostname, score);
    }
    let sortedMap = sortMap(map);
    for (let x of sortedMap) {
        //ns.tprint(x);
    }
    return sortedMap;
}