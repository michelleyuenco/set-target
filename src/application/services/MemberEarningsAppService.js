export class MemberEarningsAppService {
  constructor(memberEarningsPort) {
    this.memberEarningsPort = memberEarningsPort
  }

  getMembersEffectiveWages(members, monthSpecs) {
    return this.memberEarningsPort.getMembersEffectiveWages(members, monthSpecs)
  }
}
