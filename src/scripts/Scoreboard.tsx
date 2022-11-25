import React from "react"

export interface ScoreboardProps{
    red: number;
    blue?: number;
    green?: number;
};

interface ScoreboardState{
    helpTextClass: string;
};

export class Scoreboard extends React.Component<ScoreboardProps, ScoreboardState>{

    public constructor(props: ScoreboardProps){
        super(props);
        this.state = {helpTextClass: ""};
    }

    public render(): React.ReactNode
    {
        return (
            <div className="scoreboard">
                <div className = "row red">
                    <div className="member">Total:</div>
                    <div className="member" id="totalPointsCounter">{this.props.red}</div>
                </div>
                <div className = "row blue">
                    <div className="member">Considered:</div>
                    <div className="member" id="foundPointsCounter">{this.props.blue===undefined ? "" : this.props.blue}</div>
                </div>
                <div className = "row green">
                    <div className="member">Highlighted:</div>
                    <div className="member" id="highlightedPointsCounter">{this.props.green === undefined ? "" : this.props.green}</div>
                </div>
                <div className="row questionMark" id="questionMark" 
                    onPointerEnter={() => this.setState({helpTextClass: "show"})}
                    onPointerLeave={() => this.setState({helpTextClass: ""})}>
                    ?
                </div>
                <div className={"row helpMenu " + this.state.helpTextClass} id="helpMenu">
                    <p>Left-click to add data points to the canvas.  You can click & drag to add them more quickly.</p>

                    <p>Right-click to do a search for all data points within the specified radius. We use a quad tree to do this search efficiently.
                        The grey rectangles drawn on the grid as you add points represent the governance area of different nodes in the quad tree. </p>

                    <p>The <span className="red">red </span> number above is the total number of points on the canvas.  The <span className="blue">blue</span> 
                    number is the total number of points contained within regions returned by the quad tree - all of these points need to have their distance from the search origin specifically computed.
                    The <span className="green"> green</span> number is the number of points that we actually found within the search radius. </p>

                    <p>With a sufficiently large number of points and/or small search radius, we can see that the quad tree allows us to avoid doing distance 
                    computations on the majority of the points (eg, the <span className="blue">blue</span> number is much less than the <span className="red">red</span> number), 
                    which is the point of this exercise.</p>
                </div>
            </div>
        );
    }
}