QlikSenseD3Utils
================
This is a library intended to help Qlik Sense Extension developers in the creation of D3 visualizations.  Right now, there are only a few functions, mostly related to the creation of visualizations based on Tree Data. That being said...

**PLEASE CONTRIBUTE**

The idea here is that as we work on D3 visualizations in Sense we could add them to this library.  D3 has several different ways of dealing with data, but as you cover one of these ways, it opens up the possibilities for many visualizations built on this data schema.
For example, the createFamily function in this library takes Qlik Sense data and formats it in a way similar to the flare.json data set that you see used in many D3 visualizations.  If a developer is wanting to build a viz which uses flare, it should be fairly easy to get up and running by using this createFamily function.

*********************************
# Installation & Use
*********************************
To get access to the function in this library, simply include the senseD3utils library in your require script in your new extension.  Please see the [Zoomable Sunburst extension](https://github.com/brianwmunz/QlikSenseD3ZoomableSunbust) if you're unsure.  
For example:
```
define(["jquery", "text!./style.css", "./d3.v3.min", "./senseD3utils"], function($, cssContent) {

```
Once it's included, you can call the D3 functions by first using the library namespace, **senseD3**, and calling the function.  So for example, to use the computeTextRotation function, you call it this way:
```
senseD3.computeTextRotation(e, x);
```
and createFamily would be called this way, with the qMatrix data being passed in:
```
senseD3.createFamily(qData.qMatrix);
```


*********************************
# Function Overview       
*********************************
## createFamily

This function accepts the qMatrix of data from Qlik Sense and returns a JSON object structured in a Tree parent/child format. 
To learn more about the Tree Layout data format, read here:

[https://github.com/mbostock/d3/wiki/Tree-Layout](https://github.com/mbostock/d3/wiki/Tree-Layout)

The layout that's created by createFamily is based on the commonly used data set in D3 examples called flare.json, which you can see here:  

[http://bl.ocks.org/mbostock/raw/4063550/flare.json](http://bl.ocks.org/mbostock/raw/4063550/flare.json)

**Parameters**

dataset: qMatrix - actual data values in qMatrix format

numDims: integer - number of dimensions used to create the chart (use findNumOfDims(layout) if you don't want to hard code the number of dimensions)

familytype: string - nested hierarchy (nested) or over multiple dimensions (multiDim)

customColor: boolean - boolean based on whether custom colors are included


In order for this to work properly, the data for the extension needs to be formatted in either a child/parent/value format, or using a single parent-child relationship (more on this below).  This way, the function knows all of the associations between the data and can create a tree from it.  Again, please see the [Sunburst extension example](https://github.com/brianwmunz/QlikSenseD3ZoomableSunbust).

In your extension script, you need to first create a JSON object to hold the data tree:
```
var myJSON = {"name":layout.title,"children":[]};
```
If you looked at the flare.json example, you'll notice that this simply creates the very top level of the tree.  In this case it sets that top level to the title of the extension object.
Once this is done, you simply run the function against the qMatrix data and load it in as children to the top category:
```
myJSON.children = senseD3.createFamily(qMatrix, 2, "nested", false);
```
Now you have well formatted data that can be loaded into a d3 viz.  For example, the sunburst chart was easy to get running once the data was converted since most of the code that builds the viz itself doesn't need to be modified.

For the numDims parameter, pass an integer for the number of dimensions (default value is 2).  You can use the findNumOfDims(layout) function to get the number of dimensions if you do not have a consistent number in your extension.

familytype is a string value of either "nested" or "multiDim" - "nested" if your standard tree format where there is a hierarchical relationship between child-parent.  "multiDim" is used if you have a parent with only one child.

The customColor parameter, takes a boolean value.  The default value is false but if true, the visualization will look at the first measure, where a property has written a color code to qAttributeExpressions.0.qExpression.


## computeTextRotation

this is a function used in many d3 visualizations to compute the proper rotation of the text on the viz.  The required parameters for the function should be similar to what is used in the vizualization normally.  The first parameter is the d3 object itself and the second is a variable that is typically represented as "x" in most d3 viz.  It's essentially a range and scale of the viz:
```
senseD3.computeTextRotation(e,x);
```

## arcTween

this is another commonly seen function for animation that computes the arcs.  d is once again the parameter for the object itself.  It would be easiest to learn about the other parameters by looking at the sunburst extension.
```
senseD3.arcTween(d, x, y, radius, arc)
```

## findMaxValue

    // Traverse the dataset to find the maximum value of a 
    // specified attribute from all of the nodes in the passed dataset

this is a commonly used function to traverse a dataset to find the maximum value of a node attribute in the current dataset view. just pass in the name of the attribute (a measure like depth or size) you're interested in and your nodes object (e.g. from a collapsible tree layout) and it will return the maximun value within the graph that a user has revealed. this can be useful for scaling your visualization to the size of the page regardless of how many nodes are visible or collapsed.
```
senseD3.findMaxDepth(nodes)
```


## createJSONObj
This function creates your standard key-value pair for all of your dimensions/measures.  All keys will use the text label of the field.

**Parameters**

layout: layout - this takes the layout variable from your extension

numOfDims: integer - this is an integer value that specifies the number of dimensions


```
senseD3.createJSONObj(layout, 3)
```

**Return value**

An array of objects for each row in your hypercube.  Each object contains the dimensions and measures of that particular row.  Because labels are used to name the keys in the object, there will often times be spaces in the names and you will have to use d["Field Name"] to reference that dimension or measure.



## findNumOfDims
This function is used to find how many dimensions are contained in your HyperCube.  This is useful for passing the numDims parameter for other functions.

**Parameters**

layout: layout - this takes the layout variable from your extension


```
senseD3.findNumOfDims(layout)
```

**Return Value**

Single integer specifying the length of the dimension object