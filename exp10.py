from sklearn import datasets
from sklearn.metrics import confusion_matrix, accuracy_score
from sklearn.model_selection import train_test_split
from pandas import DataFrame
from sklearn.naive_bayes import GaussianNB

# Load the dataset
iris = datasets.load_iris()
X = iris.data           # Features
Y = iris.target         # Target labels

# Split the dataset into training and testing sets (1/3rd test data)
X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size=1/3)

# Training a Gaussian Naive Bayes classifier
model = GaussianNB()
model.fit(X_train, Y_train)

# Making predictions on the test set
model_predictions = model.predict(X_test)
print("\nPredicted labels:\n", model_predictions)
print("\nActual labels:\n", Y_test)

# Accuracy of prediction
accuracyScore = accuracy_score(Y_test, model_predictions)
print("\nAccuracy Score is:", accuracyScore)

# Creating a confusion matrix
cm = confusion_matrix(Y_test, model_predictions)
print("\nConfusion Matrix:\n", cm)
