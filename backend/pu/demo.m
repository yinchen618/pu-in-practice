function demo
global LOG
close all
rng(1);

% make logger
log4m_make_instance('demo-pu');
LOG.setCommandWindowLevel(LOG.INFO);

np = 50;
nu = 300;
nt = 1000;
prior = .3;

% options for PNU classifier
opts.model_type = 'lm';
opts.use_bias   = 'true';

[xp, xu, xt_p, xt_n] = generate_data(np, nu, prior, nt);
priorh = PenL1CP(xp, xu, [], []); % prior estimation
[func, outs] = PU_SL(xp, xu, priorh, opts);
% computes misclassification rates
errs = 100*(prior*mean(func(xt_p) < 0) + (1-prior)*mean(func(xt_n) >= 0));

fprintf('Estimated prior: %.2f, True prior: %.2f\n', priorh, prior);
fprintf('Error: %.1f\n', errs);

%% Illustration of data points and estimated decision boundary
figure('Name', 'Demo');
hold on;
% plots data points
plot(xp(:, 1), xp(:, 2), 'bo', 'LineWidth', 1.8, 'MarkerSize', 10);
plot(xu(:, 1), xu(:, 2), 'k.', 'LineWidth', 1.8, 'MarkerSize', 10);

u1 = min([xp(:, 1); xu(:, 1)]); 
u2 = max([xp(:, 2); xu(:, 2)]);

% plots optimal decision boundary
v1_opt = (log(prior/(1-prior))/2 - u1);
v2_opt = (log(prior/(1-prior))/2 - u2);
line([u1, u2], [v1_opt, v2_opt], 'LineWidth', 1.8, 'Color', 'k');

% plots estimated decision boundary
w = outs.w(1:2);
intercept = outs.w(3);
v1_est = (intercept - w(1)*u1)/w(2);
v2_est = (intercept - w(1)*u2)/w(2);
line([u1, u2], [v1_est, v2_est], 'LineWidth', 2.0, 'LineStyle', '-.');

xlabel('$x^{(1)}$', 'Interpreter', 'latex');
ylabel('$x^{(2)}$', 'Interpreter', 'latex');
xlim([-4, 4]);
ylim([-4, 4]);
title('Input data and estimated decision boundary', ...
    'Interpreter', 'latex');
legend('Positive samples', 'Unlabeled samples', ...
    'Optimal boundary', 'Estimated boundary', 'Location', 'BestOutside');
set(gca, 'LineWidth', 0.8, 'FontSize', 10);
set(gcf, 'PaperUnits',    'centimeters');
set(gcf, 'PaperPosition', [0 0 12 6]);    
set(gcf, 'PaperType',     '<custom>');
set(gcf, 'PaperSize',     [12 6]);   

% print('-dpng', 'result.png');


end

function [xp, xu, xt_p, xt_n] = generate_data(np, nu, prior, nt)
% np:      the number of positive samples
% nu:      the number of unlabeled samples
% prior:   class prior for unlabeled data, p(y=+1)
% nt:      the number of testing samples
%
% p(x | y=+1) = N( ( 1,..., 1_d)^T, , I_d)
% p(x | y=-1) = N( (-1,...,-1_d)^T, , I_d)

d    = 2;
mu_p = [ 1,  1];
mu_n = [-1, -1];

xp   = bsxfun(@plus, randn(np, d), mu_p);

nu_p = sum(rand(nu, 1) < prior);
nu_n = nu - nu_p;
xu_p = bsxfun(@plus, randn(nu_p, d), mu_p);
xu_n = bsxfun(@plus, randn(nu_n, d), mu_n);
xu   = [xu_p; xu_n];

xt_p = bsxfun(@plus, randn(nt, d), mu_p);
xt_n = bsxfun(@plus, randn(nt, d), mu_n);

end
