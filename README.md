This extension provides the ability to compare two folders within Visual Studio Code.

## Features

There is one simple feature; compare two folders.

### Make a Folder Comparison

1. From the file explorer view, right click on a folder and click "Select for Compare"
2. From the file explorer view, right click on a folder and click "Compare with Selected Folder"
3. View the comparison from the new explorer view named "FOLDER COMPARISON"

#### Visual Example of [commit 1088261 in git.git repository](https://repo.or.cz/w/git.git/commitdiff/1088261f6fc90324014b5306cca4171987da85ce#patch3)

![example](resources/readme/example.gif)

This folder comparison functionality is designed to integrate seamlessly with the file comparison functionality that exists in Visual Studio Code.  Although the right-click folder comparison menu options are named and positioned similar to the file comparison menu options, they do not interfere with one another. This means that a file comparison and a folder comparison can be made independently, and a file cannot be compared to a folder and vice-versa.
