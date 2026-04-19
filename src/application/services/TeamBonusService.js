export class TeamBonusService {
  constructor(teamBonusPort) {
    this.teamBonusPort = teamBonusPort
  }

  getTeamBonus(monthKey) {
    return this.teamBonusPort.getTeamBonus(monthKey)
  }

  saveTeamBonus(monthKey, data) {
    return this.teamBonusPort.saveTeamBonus(monthKey, data)
  }

  getMemberMonthlyHours(uid, year, month) {
    return this.teamBonusPort.getMemberMonthlyHours(uid, year, month)
  }

  getAllMembersMonthlyHours(members, year, month) {
    return this.teamBonusPort.getAllMembersMonthlyHours(members, year, month)
  }

  getAllMembersLocationHours(members, year, month) {
    return this.teamBonusPort.getAllMembersLocationHours(members, year, month)
  }

  getAllMembersGoalsForMonth(members, year, month) {
    return this.teamBonusPort.getAllMembersGoalsForMonth(members, year, month)
  }

  getAllMembersLocationStats(members, year, month) {
    return this.teamBonusPort.getAllMembersLocationStats(members, year, month)
  }
}
