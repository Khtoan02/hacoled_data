/** Remind after the first week if behind a linear monthly pace, or in the final four days. */
export function needsKpiReminder(delivered:number,target:number,day:number,days:number){
 return target>0&&delivered<target&&((day>=7&&delivered/target<day/days)||days-day<=3);
}
