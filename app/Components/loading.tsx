import "../styles/components/loading.css"

export default function Loading() {
    return (
        <div className="fetch-container">
            <div className="loading-bus">
                <div className="wheel"></div>
                <div className="wheel"></div>
            </div>

            <p className="loading-text">
                <span>L</span>
                <span>O</span>
                <span>A</span>
                <span>D</span>
                <span>I</span>
                <span>N</span>
                <span>G</span>
            </p>
        </div>
    );
}