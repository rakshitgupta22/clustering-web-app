import argparse
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import joblib
import matplotlib.pyplot as plt

# Suppress warnings
import warnings

warnings.filterwarnings("ignore")


def train(X, args):
    """
    Train k-means clustering model.

    Args:
        X (numpy.ndarray): Training data of shape (n_samples, n_features).
        args (argparse.ArgumentParser): Command-line arguments.

    Returns:
        kmeans (sklearn.cluster.KMeans): The trained model.
    """
    kmeans = KMeans(n_clusters=args.k, random_state=0).fit(X)
    return kmeans


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--data", type=str, default="data.txt", help="Path to the data file."
    )
    parser.add_argument("--k", type=int, default=3, help="Number of clusters.")
    parser.add_argument(
        "--plot", type=bool, default=True, help="Whether to plot the data."
    )
    parser.add_argument(
        "--function",
        type=str,
        default="train",
        help='Which function to run. Can be "train" or "test".',
    )
    parser.add_argument(
        "--model", type=str, default="data/model.joblib", help="Path to the model file."
    )
    args = parser.parse_args()

    # Load data
    data = pd.read_csv(args.data, header=None, sep="\t")
    data = data.dropna()
    X = data.iloc[:, :].values

    # Perform k-means clustering if function is "train"
    if args.function == "train":
        kmeans = train(X, args)
        # Save model
        joblib.dump(kmeans, args.model)
    elif args.function == "test":
        # Load model
        kmeans = joblib.load(args.model)
    else:
        raise NotImplementedError('No such function "{}".'.format(args.function))

    y_pred = kmeans.predict(X)

    # Compute silhouette score
    score = silhouette_score(X, y_pred)
    print("Silhouette score: {:.3f}".format(score))

    # Plot data and centroids
    if args.plot:
        plt.scatter(X[:, 0], X[:, 1], c=y_pred)
        plt.scatter(
            kmeans.cluster_centers_[:, 0],
            kmeans.cluster_centers_[:, 1],
            c="red",
            marker="x",
        )
        # save plot to file
        plt.savefig("data/plot.jpeg")


if __name__ == "__main__":
    main()

# Terminal: python kmeans_clustering.py --data data.txt --k 3 --plot True --function train --model model.joblib
