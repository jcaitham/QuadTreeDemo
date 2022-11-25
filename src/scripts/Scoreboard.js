import React from "react";
;
;
export class Scoreboard extends React.Component {
    constructor(props) {
        super(props);
        this.state = { helpTextClass: "" };
    }
    render() {
        return (React.createElement("div", { className: "scoreboard" },
            React.createElement("div", { className: "row red" },
                React.createElement("div", { className: "member" }, "Total:"),
                React.createElement("div", { className: "member", id: "totalPointsCounter" }, this.props.red)),
            React.createElement("div", { className: "row blue" },
                React.createElement("div", { className: "member" }, "Considered:"),
                React.createElement("div", { className: "member", id: "foundPointsCounter" }, this.props.blue === undefined ? "" : this.props.blue)),
            React.createElement("div", { className: "row green" },
                React.createElement("div", { className: "member" }, "Highlighted:"),
                React.createElement("div", { className: "member", id: "highlightedPointsCounter" }, this.props.green === undefined ? "" : this.props.green)),
            React.createElement("div", { className: "row questionMark", id: "questionMark", onPointerEnter: () => this.setState({ helpTextClass: "show" }), onPointerLeave: () => this.setState({ helpTextClass: "" }) }, "?"),
            React.createElement("div", { className: "row helpMenu " + this.state.helpTextClass, id: "helpMenu" },
                React.createElement("p", null, "Left-click to add data points to the canvas.  You can click & drag to add them more quickly."),
                React.createElement("p", null, "Right-click to do a search for all data points within the specified radius. We use a quad tree to do this search efficiently. The grey rectangles drawn on the grid as you add points represent the governance area of different nodes in the quad tree. "),
                React.createElement("p", null,
                    "The ",
                    React.createElement("span", { className: "red" }, "red "),
                    " number above is the total number of points on the canvas.  The ",
                    React.createElement("span", { className: "blue" }, "blue"),
                    "number is the total number of points contained within regions returned by the quad tree - all of these points need to have their distance from the search origin specifically computed. The ",
                    React.createElement("span", { className: "green" }, " green"),
                    " number is the number of points that we actually found within the search radius. "),
                React.createElement("p", null,
                    "With a sufficiently large number of points and/or small search radius, we can see that the quad tree allows us to avoid doing distance computations on the majority of the points (eg, the ",
                    React.createElement("span", { className: "blue" }, "blue"),
                    " number is much less than the ",
                    React.createElement("span", { className: "red" }, "red"),
                    " number), which is the point of this exercise."))));
    }
}
