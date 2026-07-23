const fs = require('fs');
const file = '.github/workflows/selenium.yml';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/      - uses: actions\/upload-artifact@v4/g, 
  `      - name: Generate Excel Report
        run: node generate-selenium-excel.cjs selenium/reports/
        if: always()
      - uses: actions/upload-artifact@v4`);

content = content.replace(/echo "\| TC_SEL_.*✅ PASS \|" >> \$GITHUB_STEP_SUMMARY\n(      - name: Generate Excel Report)/g,
  `echo "| TC_SEL_... >> $GITHUB_STEP_SUMMARY\n          echo \\"\\" >> $GITHUB_STEP_SUMMARY\n          echo \\"> **Report:** A detailed Excel report (.xlsx) and JSON report are attached as workflow artifacts.\\" >> $GITHUB_STEP_SUMMARY\n$1`);

// Actually the regex above is tricky. Let's just insert the note before "- name: Generate Excel Report"
content = content.replace(/(      - name: Generate Excel Report)/g, 
  `          echo "" >> $GITHUB_STEP_SUMMARY\n          echo "> **Report:** A detailed Excel report (.xlsx) and JSON/HTML reports are attached as workflow artifacts." >> $GITHUB_STEP_SUMMARY\n$1`);

fs.writeFileSync(file, content);
console.log('selenium.yml updated');
