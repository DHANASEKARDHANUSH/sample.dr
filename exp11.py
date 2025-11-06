import numpy as np
from sklearn import datasets
import torch
import torch.nn as nn
import torch.optim as optim
import torchbnn as bnn
import matplotlib.pyplot as plt

# ===============================
# Load Dataset
# ===============================
dataset = datasets.load_iris()
data = dataset.data
target = dataset.target

# Convert to Torch tensors
data_tensor = torch.from_numpy(data).float()
target_tensor = torch.from_numpy(target).long()

# ===============================
# Define Bayesian Neural Network
# ===============================
model = nn.Sequential(
    bnn.BayesLinear(prior_mu=0, prior_sigma=0.1, in_features=4, out_features=100),
    nn.ReLU(),
    bnn.BayesLinear(prior_mu=0, prior_sigma=0.1, in_features=100, out_features=3)
)

# Loss functions
cross_entropy_loss = nn.CrossEntropyLoss()
kl_loss = bnn.BKLLoss(reduction='mean', last_layer_only=False)

# Training setup
kl_weight = 0.01
optimizer = optim.Adam(model.parameters(), lr=0.01)

# ===============================
# Training Loop
# ===============================
for step in range(3000):
    model_output = model(data_tensor)
    cross_entropy = cross_entropy_loss(model_output, target_tensor)
    kl = kl_loss(model)
    total_cost = cross_entropy + kl_weight * kl

    optimizer.zero_grad()
    total_cost.backward()
    optimizer.step()

# ===============================
# Evaluation
# ===============================
_, predicted = torch.max(model_output.data, 1)
final = target_tensor.size(0)
correct = (predicted == target_tensor).sum()

print(f"\nAccuracy: {100 * float(correct) / final:.2f}%")
print(f"CE: {cross_entropy.item():.2f}, KL: {kl.item():.2f}")

# ===============================
# Visualization Function
# ===============================
def draw_graph(predicted):
    fig = plt.figure(figsize=(16, 8))
    fig_1 = fig.add_subplot(1, 2, 1)
    fig_2 = fig.add_subplot(1, 2, 2)

    # Real data
    z1_plot = fig_1.scatter(data[:, 0], data[:, 1], c=target, marker='v')
    plt.colorbar(z1_plot, ax=fig_1)

    # Predicted data
    z2_plot = fig_2.scatter(data[:, 0], data[:, 1], c=predicted)
    plt.colorbar(z2_plot, ax=fig_2)

    fig_1.set_title("REAL")
    fig_2.set_title("PREDICT")
    plt.show()

# ===============================
# Run Visualization
# ===============================
draw_graph(predicted)
