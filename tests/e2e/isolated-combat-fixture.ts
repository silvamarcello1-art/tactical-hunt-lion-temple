import type {Page} from '@playwright/test';
/** Keep historical spell/push input regressions in their stationary single-bot
 * fixture. Production exclusive control + active 3v3 are separately exercised
 * without interception by training-team.spec.ts. No assertions/timeouts relaxed. */
export async function isolatedCombatFixture(page:Page){
  await page.route('**/src/main.ts*',async route=>{
    const response=await route.fetch();
    const body=(await response.text()).replace(/singleHeroControl:\s*true/g,'singleHeroControl:false').replace(/trainingTeam:\s*true/g,'trainingTeam:false').replace(/tacticalControls:\s*true/g,'tacticalControls:false');
    await route.fulfill({response,body});
  });
}
