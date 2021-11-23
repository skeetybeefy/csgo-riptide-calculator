import './Reward.css'

function Reward(props) {

    let rewardClass = "reward"
    if (props.first) rewardClass += " first"

    return (
        <div className={rewardClass}>
            <img src={props.data.imgLink} alt="Reward"></img>
            <p className="reward-type">{props.data.type}</p>
            <p className="reward-profit">{`${(props.data.reward).toFixed(2)} RUB`}</p>
        </div>
    )
}

export default Reward