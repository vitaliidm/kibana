#!/bin/bash

touch "results/$INDEX_FILE.txt"
for i in {1..100}

do
    node run_preview.js --kibana http://localhost:5601/kbn | tail -n 1 >> "results/$INDEX_FILE.txt"
done

exit;